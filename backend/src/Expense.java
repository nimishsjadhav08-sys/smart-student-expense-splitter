// Expense.java
// Simple Java Model Class to represent an expense record and its split details

import java.util.ArrayList;
import java.util.List;

public class Expense {
    private int id;
    private String title;
    private double amount;
    private int paidById;
    private String paidByName;
    private String createdAt;
    private List<Integer> splitStudentIds = new ArrayList<>();
    private List<String> splitStudentNames = new ArrayList<>();
    private double perPersonAmount;

    public Expense() {
    }

    public Expense(int id, String title, double amount, int paidById, String paidByName, String createdAt) {
        this.id = id;
        this.title = title;
        this.amount = amount;
        this.paidById = paidById;
        this.paidByName = paidByName;
        this.createdAt = createdAt;
    }

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public double getAmount() {
        return amount;
    }

    public void setAmount(double amount) {
        this.amount = amount;
    }

    public int getPaidById() {
        return paidById;
    }

    public void setPaidById(int paidById) {
        this.paidById = paidById;
    }

    public String getPaidByName() {
        return paidByName;
    }

    public void setPaidByName(String paidByName) {
        this.paidByName = paidByName;
    }

    public String getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(String createdAt) {
        this.createdAt = createdAt;
    }

    public List<Integer> getSplitStudentIds() {
        return splitStudentIds;
    }

    public void setSplitStudentIds(List<Integer> splitStudentIds) {
        this.splitStudentIds = splitStudentIds;
    }

    public List<String> getSplitStudentNames() {
        return splitStudentNames;
    }

    public void setSplitStudentNames(List<String> splitStudentNames) {
        this.splitStudentNames = splitStudentNames;
    }

    public double getPerPersonAmount() {
        return perPersonAmount;
    }

    public void setPerPersonAmount(double perPersonAmount) {
        this.perPersonAmount = perPersonAmount;
    }

    // Convert Expense to JSON string
    public String toJson() {
        StringBuilder namesJson = new StringBuilder("[");
        for (int i = 0; i < splitStudentNames.size(); i++) {
            namesJson.append("\"").append(escapeJson(splitStudentNames.get(i))).append("\"");
            if (i < splitStudentNames.size() - 1) namesJson.append(",");
        }
        namesJson.append("]");

        StringBuilder idsJson = new StringBuilder("[");
        for (int i = 0; i < splitStudentIds.size(); i++) {
            idsJson.append(splitStudentIds.get(i));
            if (i < splitStudentIds.size() - 1) idsJson.append(",");
        }
        idsJson.append("]");

        return "{"
                + "\"id\":" + id + ","
                + "\"title\":\"" + escapeJson(title) + "\","
                + "\"amount\":" + String.format(java.util.Locale.US, "%.2f", amount) + ","
                + "\"paidById\":" + paidById + ","
                + "\"paidByName\":\"" + escapeJson(paidByName) + "\","
                + "\"createdAt\":\"" + escapeJson(createdAt) + "\","
                + "\"perPersonAmount\":" + String.format(java.util.Locale.US, "%.2f", perPersonAmount) + ","
                + "\"splitStudentIds\":" + idsJson.toString() + ","
                + "\"splitStudentNames\":" + namesJson.toString()
                + "}";
    }

    private static String escapeJson(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n").replace("\r", "");
    }
}
