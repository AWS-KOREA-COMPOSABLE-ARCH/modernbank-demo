package com.modernbank.transfer.utils;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.ModelAndView;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class RequestLoggingInterceptor implements HandlerInterceptor {

    private static final Logger logger = LoggerFactory.getLogger(RequestLoggingInterceptor.class);
    private static final ThreadLocal<StringBuilder> logMessageThreadLocal = new ThreadLocal<>();

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        long startTime = System.currentTimeMillis();
        request.setAttribute("startTime", startTime);

        StringBuilder logMessage = new StringBuilder();
        logMessage.append(String.format("Request: %s %s from %s at %s, ",
                request.getMethod(),
                request.getRequestURI(),
                request.getRemoteAddr(),
                LocalDateTime.now()));

        String parameters = Collections.list(request.getParameterNames()).stream()
                .map(name -> name + "=" + request.getParameter(name))
                .collect(Collectors.joining(", "));
        logMessage.append("Parameters: [").append(parameters).append("], ");

        logMessageThreadLocal.set(logMessage);

        return true;
    }

    @Override
    public void postHandle(HttpServletRequest request, HttpServletResponse response, Object handler, ModelAndView modelAndView) throws Exception {
        // Add additional logic here if needed
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) throws Exception {
        long startTime = (Long) request.getAttribute("startTime");
        long endTime = System.currentTimeMillis();
        long executeTime = endTime - startTime;

        StringBuilder logMessage = logMessageThreadLocal.get();
        logMessage.append(String.format("Response: Status %d, Duration %d ms", 
                response.getStatus(), 
                executeTime));

        logger.info(logMessage.toString());

        logMessageThreadLocal.remove(); // Clean up thread local variables
    }
}