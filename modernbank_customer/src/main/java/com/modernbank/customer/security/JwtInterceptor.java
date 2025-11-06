package com.modernbank.customer.security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

@Component
public class JwtInterceptor implements HandlerInterceptor {
    private static final int[] SKIP_PORTS = {8081, 8082, 8083, 8084, 8085};

    @Autowired
    private JwtValidator jwtValidator;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        // Always return true for OPTIONS requests
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }
        

        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie cookie : cookies) {
                if (cookie.getName().equals("jwt_token")) {
                    String token = cookie.getValue();
                    if (jwtValidator.validateToken(token)) {
                        String userId = jwtValidator.getUserIdFromToken(token);
                        HttpSession session = request.getSession();
                        session.setAttribute("userId", userId);
                        System.out.println("JwtInterceptor token validation success...");
                        return true;
                    }
                    break;
                }
            }
        }

        int requestPort = request.getLocalPort();
        System.out.println("[REQUEST PORT] " + requestPort);
        for (int port : SKIP_PORTS) {
            if (requestPort == port) {
                System.out.println("JwtInterceptor skipping validation for port: " + requestPort);
                return true;
            }
        }

        System.out.println("JwtInterceptor token validation failed...");
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        String jsonMessage = "{\"error\": \"Unauthorized\", \"message\": \"Authentication failed. Please log in again.\"}";
        response.getWriter().write(jsonMessage);

        return false;
    }
}