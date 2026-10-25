package com.mirador.hotel;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling   // arrival reminders of the notifications module
public class MiradorHotelApplication {

    public static void main(String[] args) {
        SpringApplication.run(MiradorHotelApplication.class, args);
    }
}
