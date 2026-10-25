package com.mirador.hotel.config;

import org.springframework.beans.factory.InitializingBean;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;

/**
 * Creates the tables of the modules taken from the microservices (promotions, avis, notifications, facturation,
 * paiements) when they are missing. The rest of the schema is managed by JPA ({@code ddl-auto=update}).
 */
@Component
public class ModulesSchemaInitializer implements InitializingBean {

    private final DataSource dataSource;

    public ModulesSchemaInitializer(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @Override
    public void afterPropertiesSet() {
        new ResourceDatabasePopulator(new ClassPathResource("modules-schema.sql")).execute(dataSource);
    }
}
