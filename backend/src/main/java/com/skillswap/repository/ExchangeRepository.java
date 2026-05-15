package com.skillswap.repository;

import com.skillswap.model.Exchange;
import com.skillswap.model.enums.ExchangeStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ExchangeRepository extends JpaRepository<Exchange, UUID> {

    @Query("SELECT e FROM Exchange e " +
           "JOIN FETCH e.partyA JOIN FETCH e.partyB " +
           "JOIN FETCH e.skillA JOIN FETCH e.skillB " +
           "WHERE e.partyA.userId = :userId OR e.partyB.userId = :userId " +
           "ORDER BY e.createdAt DESC")
    List<Exchange> findAllForUser(@Param("userId") UUID userId);

    @Query("SELECT e FROM Exchange e " +
           "JOIN FETCH e.partyA JOIN FETCH e.partyB " +
           "JOIN FETCH e.skillA JOIN FETCH e.skillB " +
           "WHERE e.exchangeId = :id")
    Optional<Exchange> findByIdWithFetch(@Param("id") UUID id);

    boolean existsByStatusAndPartyAUserIdAndPartyBUserId(ExchangeStatus status, UUID partyA, UUID partyB);
    boolean existsByStatusAndPartyBUserIdAndPartyAUserId(ExchangeStatus status, UUID partyB, UUID partyA);
}
