// ExpenseServer.java
// Standalone Java HTTP Server for Smart Student Expense Splitter
// Uses built-in com.sun.net.httpserver.HttpServer (No external frameworks or Tomcat needed!)

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpServer;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.UnsupportedEncodingException;
import java.net.InetSocketAddress;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class ExpenseServer {

    private static final int PORT = 3000;
    private static File frontendDir;

    public static void main(String[] args) throws IOException {
        // Locate frontend directory relative to current working directory or src
        frontendDir = findFrontendDirectory();
        System.out.println("==================================================");
        System.out.println("   SMART STUDENT EXPENSE SPLITTER - JAVA BACKEND  ");
        System.out.println("==================================================");
        System.out.println("[Server] Serving Frontend from: " + frontendDir.getAbsolutePath());

        // Start Built-in HTTP Server (Auto-retry next port if busy, unless fixed port is given via env)
        int port = PORT;
        String envPort = System.getenv("PORT");
        boolean isEnvPort = false;
        if (envPort != null && !envPort.trim().isEmpty()) {
            try {
                port = Integer.parseInt(envPort.trim());
                isEnvPort = true;
            } catch (NumberFormatException ignored) {}
        } else if (args != null && args.length > 0) {
            try {
                port = Integer.parseInt(args[0]);
                isEnvPort = true;
            } catch (NumberFormatException ignored) {}
        }

        HttpServer server = null;
        int maxAttempts = isEnvPort ? 1 : 10;
        for (int p = port; p < port + maxAttempts; p++) {
            try {
                server = HttpServer.create(new InetSocketAddress(p), 0);
                port = p;
                break;
            } catch (java.net.BindException e) {
                System.out.println("[Server] Port " + p + " is already in use by another process.");
                if (p == port + maxAttempts - 1) {
                    System.err.println("[Server] Unable to bind to port " + p + ".");
                    throw e;
                }
                System.out.println("[Server] Automatically trying port " + (p + 1) + "...");
            }
        }

        // API Contexts
        server.createContext("/api/health", new HealthHandler());
        server.createContext("/api/login", new LoginHandler());
        server.createContext("/api/register", new RegisterHandler());
        server.createContext("/api/students", new StudentsHandler());
        server.createContext("/api/expenses", new ExpensesHandler());
        server.createContext("/api/summary", new SummaryHandler());

        // Static Files Context (Serves HTML, CSS, JS)
        server.createContext("/", new StaticFileHandler());

        server.setExecutor(null); // default multithreaded executor
        server.start();

        System.out.println("[Server] Server successfully started at http://localhost:" + port + "/");
        System.out.println("[Server] Open http://localhost:" + port + "/ in your web browser.");
        System.out.println("==================================================");

        // Initialize Database Connection
        DBConnection.initDatabase();
    }

    private static File findFrontendDirectory() {
        File candidate1 = new File("frontend");
        if (candidate1.exists() && candidate1.isDirectory()) return candidate1;

        File candidate2 = new File("../frontend");
        if (candidate2.exists() && candidate2.isDirectory()) return candidate2;

        File candidate3 = new File("../../frontend");
        if (candidate3.exists() && candidate3.isDirectory()) return candidate3;

        return new File(".");
    }

    // ==========================================
    // Handlers
    // ==========================================

    static class HealthHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            addCorsHeaders(exchange);
            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                exchange.sendResponseHeaders(204, -1);
                return;
            }
            String mode = DBConnection.isUsingMySQL() ? "MySQL" : "In-Memory";
            long now = System.currentTimeMillis();
            String json = "{\"status\":\"UP\",\"database\":\"" + mode + "\",\"timestamp\":" + now + "}";
            sendJsonResponse(exchange, 200, json);
        }
    }

    static class StaticFileHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            String path = exchange.getRequestURI().getPath();
            if (path == null || path.equals("/") || path.isEmpty()) {
                path = "/index.html";
            }

            // Guard against directory traversal
            if (path.contains("..")) {
                sendResponse(exchange, 400, "text/plain", "Bad Request");
                return;
            }

            byte[] bytes = null;
            File requestedFile = new File(frontendDir, path.substring(1));

            // 1. Try reading from filesystem
            try {
                if (requestedFile.exists() && !requestedFile.isDirectory()) {
                    String baseCanonical = frontendDir.getCanonicalPath();
                    String fileCanonical = requestedFile.getCanonicalPath();
                    if (fileCanonical.startsWith(baseCanonical)) {
                        try (FileInputStream fis = new FileInputStream(requestedFile)) {
                            bytes = readAllBytesFromStream(fis);
                        }
                    }
                }
            } catch (Exception ignored) {}

            // 2. If not found on filesystem, fallback to classpath / JAR resource
            if (bytes == null) {
                InputStream is = ExpenseServer.class.getResourceAsStream("/frontend" + path);
                if (is == null) {
                    is = ExpenseServer.class.getResourceAsStream(path);
                }
                if (is != null) {
                    try (InputStream cpIs = is) {
                        bytes = readAllBytesFromStream(cpIs);
                    }
                }
            }

            if (bytes == null) {
                sendResponse(exchange, 404, "text/plain", "404 Not Found");
                return;
            }

            String contentType = "text/plain";
            String lower = path.toLowerCase();
            if (lower.endsWith(".html")) contentType = "text/html; charset=UTF-8";
            else if (lower.endsWith(".css")) contentType = "text/css; charset=UTF-8";
            else if (lower.endsWith(".js")) contentType = "application/javascript; charset=UTF-8";
            else if (lower.endsWith(".json")) contentType = "application/json; charset=UTF-8";
            else if (lower.endsWith(".png")) contentType = "image/png";
            else if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) contentType = "image/jpeg";
            else if (lower.endsWith(".svg")) contentType = "image/svg+xml";
            else if (lower.endsWith(".ico")) contentType = "image/x-icon";
            else if (lower.endsWith(".woff2")) contentType = "font/woff2";
            else if (lower.endsWith(".woff")) contentType = "font/woff";
            else if (lower.endsWith(".ttf")) contentType = "font/ttf";

            exchange.getResponseHeaders().set("Content-Type", contentType);
            exchange.sendResponseHeaders(200, bytes.length);
            try (OutputStream os = exchange.getResponseBody()) {
                os.write(bytes);
            }
        }
    }

    static class LoginHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            addCorsHeaders(exchange);
            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                exchange.sendResponseHeaders(204, -1);
                return;
            }

            if (!"POST".equalsIgnoreCase(exchange.getRequestMethod())) {
                sendJsonResponse(exchange, 405, "{\"error\":\"Method Not Allowed\"}");
                return;
            }

            String body = readRequestBody(exchange);
            String email = extractJsonString(body, "email");
            String password = extractJsonString(body, "password");

            if (email.isEmpty() || password.isEmpty()) {
                sendJsonResponse(exchange, 400, "{\"success\":false,\"message\":\"Email and password are required\"}");
                return;
            }

            Student s = DBConnection.login(email, password);
            if (s != null) {
                sendJsonResponse(exchange, 200, "{\"success\":true,\"student\":" + s.toJson() + "}");
            } else {
                sendJsonResponse(exchange, 401, "{\"success\":false,\"message\":\"Invalid email or password\"}");
            }
        }
    }

    static class RegisterHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            addCorsHeaders(exchange);
            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                exchange.sendResponseHeaders(204, -1);
                return;
            }

            if (!"POST".equalsIgnoreCase(exchange.getRequestMethod())) {
                sendJsonResponse(exchange, 405, "{\"error\":\"Method Not Allowed\"}");
                return;
            }

            String body = readRequestBody(exchange);
            String name = extractJsonString(body, "name");
            String email = extractJsonString(body, "email");
            String password = extractJsonString(body, "password");

            if (name.isEmpty() || email.isEmpty() || password.isEmpty()) {
                sendJsonResponse(exchange, 400, "{\"success\":false,\"message\":\"All fields are required\"}");
                return;
            }

            Student s = DBConnection.register(name, email, password);
            if (s != null) {
                sendJsonResponse(exchange, 201, "{\"success\":true,\"student\":" + s.toJson() + "}");
            } else {
                sendJsonResponse(exchange, 409, "{\"success\":false,\"message\":\"Email is already registered!\"}");
            }
        }
    }

    static class StudentsHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            addCorsHeaders(exchange);
            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                exchange.sendResponseHeaders(204, -1);
                return;
            }

            List<Student> students = DBConnection.getAllStudents();
            StringBuilder sb = new StringBuilder("[");
            for (int i = 0; i < students.size(); i++) {
                sb.append(students.get(i).toJson());
                if (i < students.size() - 1) sb.append(",");
            }
            sb.append("]");
            sendJsonResponse(exchange, 200, sb.toString());
        }
    }

    static class ExpensesHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            addCorsHeaders(exchange);
            String method = exchange.getRequestMethod().toUpperCase();

            if ("OPTIONS".equals(method)) {
                exchange.sendResponseHeaders(204, -1);
                return;
            }

            if ("GET".equals(method)) {
                List<Expense> expenses = DBConnection.getAllExpenses();
                StringBuilder sb = new StringBuilder("[");
                for (int i = 0; i < expenses.size(); i++) {
                    sb.append(expenses.get(i).toJson());
                    if (i < expenses.size() - 1) sb.append(",");
                }
                sb.append("]");
                sendJsonResponse(exchange, 200, sb.toString());
            } else if ("POST".equals(method)) {
                String body = readRequestBody(exchange);
                String title = extractJsonString(body, "title");
                double amount = extractJsonDouble(body, "amount");
                int paidById = extractJsonInt(body, "paidById");
                List<Integer> studentIds = extractJsonIntList(body, "studentIds");

                if (title.isEmpty() || amount <= 0 || paidById <= 0 || studentIds.isEmpty()) {
                    sendJsonResponse(exchange, 400, "{\"success\":false,\"message\":\"Invalid expense details or no students selected.\"}");
                    return;
                }

                boolean ok = DBConnection.addExpense(title, amount, paidById, studentIds);
                if (ok) {
                    sendJsonResponse(exchange, 201, "{\"success\":true,\"message\":\"Expense added successfully\"}");
                } else {
                    sendJsonResponse(exchange, 500, "{\"success\":false,\"message\":\"Failed to save expense\"}");
                }
            } else if ("DELETE".equals(method)) {
                Map<String, String> queryParams = parseQueryParams(exchange.getRequestURI().getQuery());
                int expenseId = -1;
                try {
                    expenseId = Integer.parseInt(queryParams.getOrDefault("id", "-1"));
                } catch (NumberFormatException ignored) {}

                if (expenseId <= 0) {
                    sendJsonResponse(exchange, 400, "{\"success\":false,\"message\":\"Missing or invalid expense ID\"}");
                    return;
                }

                boolean deleted = DBConnection.deleteExpense(expenseId);
                if (deleted) {
                    sendJsonResponse(exchange, 200, "{\"success\":true,\"message\":\"Expense deleted successfully\"}");
                } else {
                    sendJsonResponse(exchange, 404, "{\"success\":false,\"message\":\"Expense not found\"}");
                }
            } else {
                sendJsonResponse(exchange, 405, "{\"error\":\"Method Not Allowed\"}");
            }
        }
    }

    static class SummaryHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            addCorsHeaders(exchange);
            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                exchange.sendResponseHeaders(204, -1);
                return;
            }

            Map<String, String> params = parseQueryParams(exchange.getRequestURI().getQuery());
            int studentId = 1;
            try {
                studentId = Integer.parseInt(params.getOrDefault("studentId", "1"));
            } catch (NumberFormatException ignored) {}

            String summaryJson = DBConnection.calculateSummaryJson(studentId);
            sendJsonResponse(exchange, 200, summaryJson);
        }
    }

    // ==========================================
    // Helper Methods
    // ==========================================

    private static void addCorsHeaders(HttpExchange exchange) {
        exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().set("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
        exchange.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type");
    }

    private static void sendJsonResponse(HttpExchange exchange, int statusCode, String jsonResponse) throws IOException {
        addCorsHeaders(exchange);
        byte[] bytes = jsonResponse.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", "application/json; charset=UTF-8");
        exchange.sendResponseHeaders(statusCode, bytes.length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(bytes);
        }
    }

    private static void sendResponse(HttpExchange exchange, int statusCode, String contentType, String content) throws IOException {
        byte[] bytes = content.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", contentType);
        exchange.sendResponseHeaders(statusCode, bytes.length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(bytes);
        }
    }

    private static byte[] readAllBytesFromStream(InputStream is) throws IOException {
        ByteArrayOutputStream buffer = new ByteArrayOutputStream();
        byte[] data = new byte[8192];
        int nRead;
        while ((nRead = is.read(data, 0, data.length)) != -1) {
            buffer.write(data, 0, nRead);
        }
        return buffer.toByteArray();
    }

    private static String readRequestBody(HttpExchange exchange) throws IOException {
        try (InputStream is = exchange.getRequestBody()) {
            return new String(readAllBytesFromStream(is), StandardCharsets.UTF_8);
        }
    }

    private static Map<String, String> parseQueryParams(String query) {
        Map<String, String> result = new HashMap<>();
        if (query == null || query.isEmpty()) return result;
        String[] pairs = query.split("&");
        for (String pair : pairs) {
            String[] kv = pair.split("=");
            try {
                if (kv.length == 2) {
                    result.put(URLDecoder.decode(kv[0], "UTF-8"), URLDecoder.decode(kv[1], "UTF-8"));
                } else if (kv.length == 1) {
                    result.put(URLDecoder.decode(kv[0], "UTF-8"), "");
                }
            } catch (UnsupportedEncodingException ignored) {}
        }
        return result;
    }

    // Simple JSON Extractors without external libraries
    private static String extractJsonString(String json, String key) {
        Pattern pattern = Pattern.compile("\"" + key + "\"\\s*:\\s*\"([^\"]*)\"");
        Matcher matcher = pattern.matcher(json);
        if (matcher.find()) {
            return matcher.group(1);
        }
        return "";
    }

    private static double extractJsonDouble(String json, String key) {
        Pattern pattern = Pattern.compile("\"" + key + "\"\\s*:\\s*([0-9]+(?:\\.[0-9]+)?)");
        Matcher matcher = pattern.matcher(json);
        if (matcher.find()) {
            try {
                return Double.parseDouble(matcher.group(1));
            } catch (NumberFormatException ignored) {}
        }
        return 0.0;
    }

    private static int extractJsonInt(String json, String key) {
        Pattern pattern = Pattern.compile("\"" + key + "\"\\s*:\\s*([0-9]+)");
        Matcher matcher = pattern.matcher(json);
        if (matcher.find()) {
            try {
                return Integer.parseInt(matcher.group(1));
            } catch (NumberFormatException ignored) {}
        }
        return 0;
    }

    private static List<Integer> extractJsonIntList(String json, String key) {
        List<Integer> list = new ArrayList<>();
        Pattern pattern = Pattern.compile("\"" + key + "\"\\s*:\\s*\\[([^\\]]*)\\]");
        Matcher matcher = pattern.matcher(json);
        if (matcher.find()) {
            String arrayContent = matcher.group(1);
            String[] tokens = arrayContent.split(",");
            for (String t : tokens) {
                String clean = t.trim().replace("\"", "");
                if (!clean.isEmpty()) {
                    try {
                        list.add(Integer.parseInt(clean));
                    } catch (NumberFormatException ignored) {}
                }
            }
        }
        return list;
    }
}
