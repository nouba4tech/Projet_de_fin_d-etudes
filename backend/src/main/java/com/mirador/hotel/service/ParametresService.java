package com.mirador.hotel.service;

import com.mirador.hotel.dto.ParametresDtos;
import com.mirador.hotel.exception.ResourceNotFoundException;
import com.mirador.hotel.repository.ParametresRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class ParametresService {

    private final ParametresRepository parametresRepository;

    public ParametresService(ParametresRepository parametresRepository) {
        this.parametresRepository = parametresRepository;
    }

    // ===== ROOM TYPES =====
    public List<ParametresDtos.RoomTypeResponse> listRoomTypes() {
        return parametresRepository.findAllRoomTypes();
    }

    public ParametresDtos.RoomTypeResponse getRoomType(String id) {
        return parametresRepository.findRoomTypeById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Type de chambre introuvable."));
    }

    public ParametresDtos.RoomTypeResponse createRoomType(ParametresDtos.RoomTypeRequest request) {
        int id = parametresRepository.createRoomType(request);
        return parametresRepository.findRoomTypeById(String.valueOf(id))
                .orElseThrow(() -> new ResourceNotFoundException("Type de chambre cree introuvable."));
    }

    public ParametresDtos.RoomTypeResponse updateRoomType(String id, ParametresDtos.RoomTypeRequest request) {
        parametresRepository.findRoomTypeById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Type de chambre introuvable."));
        parametresRepository.updateRoomType(id, request);
        return parametresRepository.findRoomTypeById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Type de chambre mis a jour introuvable."));
    }

    public void deleteRoomType(String id) {
        parametresRepository.findRoomTypeById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Type de chambre introuvable."));
        parametresRepository.deleteRoomType(id);
    }

    // ===== ROOMS =====
    public List<ParametresDtos.RoomResponse> listRooms(String status) {
        return parametresRepository.findAllRooms(status);
    }

    public ParametresDtos.RoomResponse getRoom(String id) {
        return parametresRepository.findRoomById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Chambre introuvable."));
    }

    public ParametresDtos.RoomResponse createRoom(ParametresDtos.RoomRequest request) {
        parametresRepository.createRoom(request);
        return parametresRepository.findRoomById(request.number())
                .orElseThrow(() -> new ResourceNotFoundException("Chambre creee introuvable."));
    }

    public ParametresDtos.RoomResponse updateRoom(String id, ParametresDtos.RoomRequest request) {
        parametresRepository.findRoomById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Chambre introuvable."));
        parametresRepository.updateRoom(id, request);
        return parametresRepository.findRoomById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Chambre mise a jour introuvable."));
    }

    public void deleteRoom(String id) {
        parametresRepository.findRoomById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Chambre introuvable."));
        parametresRepository.deleteRoom(id);
    }

    // ===== PERSONNEL =====
    public List<ParametresDtos.PersonnelResponse> listPersonnel(String status) {
        return parametresRepository.findAllPersonnel(status);
    }

    public ParametresDtos.PersonnelResponse getPersonnel(String id) {
        return parametresRepository.findPersonnelById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Personnel introuvable."));
    }

    public ParametresDtos.PersonnelResponse createPersonnel(ParametresDtos.PersonnelRequest request) {
        long id = parametresRepository.createPersonnel(request);
        return parametresRepository.findPersonnelById(String.valueOf(id))
                .orElseThrow(() -> new ResourceNotFoundException("Personnel cree introuvable."));
    }

    public ParametresDtos.PersonnelResponse updatePersonnel(String id, ParametresDtos.PersonnelRequest request) {
        parametresRepository.findPersonnelById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Personnel introuvable."));
        parametresRepository.updatePersonnel(id, request);
        return parametresRepository.findPersonnelById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Personnel mis a jour introuvable."));
    }

    public void deletePersonnel(String id) {
        parametresRepository.findPersonnelById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Personnel introuvable."));
        parametresRepository.deletePersonnel(id);
    }

    // ===== CASH REGISTERS =====
    public List<ParametresDtos.CashRegisterResponse> listCashRegisters(String status) {
        return parametresRepository.findAllCashRegisters(status);
    }

    public ParametresDtos.CashRegisterResponse getCashRegister(String id) {
        return parametresRepository.findCashRegisterById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Caisse introuvable."));
    }

    public ParametresDtos.CashRegisterResponse createCashRegister(ParametresDtos.CashRegisterRequest request) {
        int id = parametresRepository.createCashRegister(request);
        return parametresRepository.findCashRegisterById(String.valueOf(id))
                .orElseThrow(() -> new ResourceNotFoundException("Caisse creee introuvable."));
    }

    public ParametresDtos.CashRegisterResponse updateCashRegister(String id, ParametresDtos.CashRegisterRequest request) {
        parametresRepository.findCashRegisterById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Caisse introuvable."));
        parametresRepository.updateCashRegister(id, request);
        return parametresRepository.findCashRegisterById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Caisse mise a jour introuvable."));
    }

    public void deleteCashRegister(String id) {
        parametresRepository.findCashRegisterById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Caisse introuvable."));
        parametresRepository.deleteCashRegister(id);
    }

    // ===== SUPPLIERS =====
    public List<ParametresDtos.SupplierResponse> listSuppliers(String status) {
        return parametresRepository.findAllSuppliers(status);
    }

    public ParametresDtos.SupplierResponse getSupplier(String id) {
        return parametresRepository.findSupplierById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Fournisseur introuvable."));
    }

    public ParametresDtos.SupplierResponse createSupplier(ParametresDtos.SupplierRequest request) {
        int id = parametresRepository.createSupplier(request);
        return parametresRepository.findSupplierById(String.valueOf(id))
                .orElseThrow(() -> new ResourceNotFoundException("Fournisseur cree introuvable."));
    }

    public ParametresDtos.SupplierResponse updateSupplier(String id, ParametresDtos.SupplierRequest request) {
        parametresRepository.findSupplierById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Fournisseur introuvable."));
        parametresRepository.updateSupplier(id, request);
        return parametresRepository.findSupplierById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Fournisseur mis a jour introuvable."));
    }

    public void deleteSupplier(String id) {
        parametresRepository.findSupplierById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Fournisseur introuvable."));
        parametresRepository.deleteSupplier(id);
    }

    // ===== CLIENTS =====
    public List<ParametresDtos.ClientParametreResponse> listClients(String status) {
        return parametresRepository.findAllClients(status);
    }

    public ParametresDtos.ClientParametreResponse getClient(String id) {
        return parametresRepository.findClientById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Client introuvable."));
    }

    public ParametresDtos.ClientParametreResponse createClient(ParametresDtos.ClientParametreRequest request) {
        long id = parametresRepository.createClient(request);
        return parametresRepository.findClientById(String.valueOf(id))
                .orElseThrow(() -> new ResourceNotFoundException("Client cree introuvable."));
    }

    public ParametresDtos.ClientParametreResponse updateClient(String id, ParametresDtos.ClientParametreRequest request) {
        parametresRepository.findClientById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Client introuvable."));
        parametresRepository.updateClient(id, request);
        return parametresRepository.findClientById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Client mis a jour introuvable."));
    }

    public void deleteClient(String id) {
        parametresRepository.findClientById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Client introuvable."));
        parametresRepository.deleteClient(id);
    }

    // ===== SERVICES =====
    public List<ParametresDtos.ServiceResponse> listServices(String category) {
        return parametresRepository.findAllServices(category);
    }

    public ParametresDtos.ServiceResponse getService(String id) {
        return parametresRepository.findServiceById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Service introuvable."));
    }

    public ParametresDtos.ServiceResponse createService(ParametresDtos.ServiceRequest request) {
        int id = parametresRepository.createService(request);
        return parametresRepository.findServiceById(String.valueOf(id))
                .orElseThrow(() -> new ResourceNotFoundException("Service cree introuvable."));
    }

    public ParametresDtos.ServiceResponse updateService(String id, ParametresDtos.ServiceRequest request) {
        parametresRepository.findServiceById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Service introuvable."));
        parametresRepository.updateService(id, request);
        return parametresRepository.findServiceById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Service mis a jour introuvable."));
    }

    public void deleteService(String id) {
        parametresRepository.findServiceById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Service introuvable."));
        parametresRepository.deleteService(id);
    }

    // ===== GENERAL PARAMETERS =====
    public List<ParametresDtos.ParameterResponse> listParameters(String category) {
        return parametresRepository.findAllParameters(category);
    }

    public ParametresDtos.ParameterResponse getParameter(String id) {
        return parametresRepository.findParameterById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Parametre introuvable."));
    }

    public ParametresDtos.ParameterResponse createParameter(ParametresDtos.ParameterRequest request) {
        parametresRepository.createParameter(request);
        return parametresRepository.findParameterById("1")
                .orElseThrow(() -> new ResourceNotFoundException("Parametre créé introuvable."));
    }

    public ParametresDtos.ParameterResponse updateParameter(String id, ParametresDtos.ParameterRequest request) {
        parametresRepository.findParameterById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Parametre introuvable."));
        parametresRepository.updateParameter(id, request);
        return parametresRepository.findParameterById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Parametre mis a jour introuvable."));
    }

    public void deleteParameter(String id) {
        parametresRepository.findParameterById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Parametre introuvable."));
        parametresRepository.deleteParameter(id);
    }
}
