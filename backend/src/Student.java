// Student.java
// Simple Java Model Class to represent a student user

public class Student {
    private int id;
    private String name;
    private String email;
    private String password;

    // Default constructor
    public Student() {
    }

    // Parameterized constructor
    public Student(int id, String name, String email, String password) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.password = password;
    }

    // Getters and Setters
    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    // Simple method to return JSON representation without external libraries
    public String toJson() {
        return "{"
                + "\"id\":" + id + ","
                + "\"name\":\"" + escapeJson(name) + "\","
                + "\"email\":\"" + escapeJson(email) + "\""
                + "}";
    }

    private static String escapeJson(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n").replace("\r", "");
    }
}
