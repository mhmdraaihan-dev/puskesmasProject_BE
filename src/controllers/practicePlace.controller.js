import {
    createPracticePlaceService,
    getAllPracticePlacesService,
    getPracticePlacesByVillageService,
    getPracticePlaceByIdService,
    updatePracticePlaceService,
    deletePracticePlaceService
} from "../services/practicePlace.service.js";

export const createPracticePlaceController = async (req, res) => {
    try {
        const newPracticePlace = await createPracticePlaceService(req.body);
        res.status(201).json({
            success: true,
            message: 'Tempat praktik berhasil dibuat',
            data: newPracticePlace
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

export const getAllPracticePlacesController = async (req, res) => {
    try {
        const practicePlaces = await getAllPracticePlacesService({
            village_id: req.query.village_id,
        }, req.user);
        res.status(200).json({
            success: true,
            data: practicePlaces
        });
    } catch (error) {
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.message
        });
    }
};

export const getPracticePlacesByVillageController = async (req, res) => {
    try {
        const { village_id } = req.params;
        const practicePlaces = await getPracticePlacesByVillageService(village_id, req.user);
        res.status(200).json({
            success: true,
            data: practicePlaces
        });
    } catch (error) {
        res.status(error.statusCode || 404).json({
            success: false,
            message: error.message
        });
    }
};

export const getPracticePlaceByIdController = async (req, res) => {
    try {
        const { practice_id } = req.params;
        const practicePlace = await getPracticePlaceByIdService(practice_id, req.user);
        res.status(200).json({
            success: true,
            data: practicePlace
        });
    } catch (error) {
        res.status(error.statusCode || 404).json({
            success: false,
            message: error.message
        });
    }
};

export const updatePracticePlaceController = async (req, res) => {
    try {
        const { practice_id } = req.params;
        const updatedPracticePlace = await updatePracticePlaceService(practice_id, req.body);
        res.status(200).json({
            success: true,
            message: 'Tempat praktik berhasil diupdate',
            data: updatedPracticePlace
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

export const deletePracticePlaceController = async (req, res) => {
    try {
        const { practice_id } = req.params;
        const result = await deletePracticePlaceService(practice_id);
        res.status(200).json({
            success: true,
            message: result.message
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};
