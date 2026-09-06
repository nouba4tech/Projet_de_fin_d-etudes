package com.mirador.hotel.controller;

import com.mirador.hotel.dto.HotelDtos;
import com.mirador.hotel.service.DashboardService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping
    public HotelDtos.DashboardSummaryResponse getDashboard() {
        return dashboardService.getDashboardSummary();
    }

    @GetMapping("/revenue-chart")
    public HotelDtos.RevenueChartResponse getRevenueChart() {
        return dashboardService.getRevenueChart();
    }
}
