package com.mirador.hotel.service;

import com.mirador.hotel.dto.HotelDtos;
import com.mirador.hotel.repository.DashboardRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class DashboardService {

    private final DashboardRepository dashboardRepository;

    public DashboardService(DashboardRepository dashboardRepository) {
        this.dashboardRepository = dashboardRepository;
    }

    public HotelDtos.DashboardSummaryResponse getDashboardSummary() {
        return dashboardRepository.getDashboardSummary();
    }

    public HotelDtos.RevenueChartResponse getRevenueChart() {
        return dashboardRepository.getRevenueChart();
    }
}
