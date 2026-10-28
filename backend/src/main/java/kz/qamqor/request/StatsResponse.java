package kz.qamqor.request;

public record StatsResponse(long activeRequests, long volunteers, long cities, long completedRequests) {}
