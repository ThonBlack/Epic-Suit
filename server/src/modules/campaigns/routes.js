const express = require('express');
const multer = require('multer');
const path = require('path');

class CampaignRoutes {
    constructor(service) {
        this.service = service;
        this.router = express.Router();
        this.setupRoutes();
    }

    setupRoutes() {
        // Upload config
        const userDataPath = process.env.USER_DATA_PATH;
        const uploadDir = userDataPath ? path.join(userDataPath, 'uploads') : path.join(__dirname, '..', '..', '..', 'uploads');

        const storage = multer.diskStorage({
            destination: (req, file, cb) => cb(null, uploadDir),
            filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
        });
        const upload = multer({ storage });

        // LIST
        this.router.get('/', async (req, res) => {
            try {
                const campaigns = await this.service.getCampaigns();
                res.json(campaigns);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // DETAILS
        this.router.get('/:id', async (req, res) => {
            try {
                const campaign = await this.service.getCampaignDetails(req.params.id);
                if (!campaign) return res.status(404).json({ error: 'Campanha não encontrada' });
                res.json(campaign);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // CREATE
        this.router.post('/', upload.fields([{ name: 'csv', maxCount: 1 }, { name: 'media', maxCount: 1 }]), async (req, res) => {
            try {
                const campaign = await this.service.createCampaign(req.body, req.files);
                res.status(201).json(campaign);
            } catch (error) {
                console.error(error);
                res.status(400).json({ error: error.message });
            }
        });

        // TOGGLE STATUS
        this.router.post('/:id/toggle', async (req, res) => {
            try {
                const campaign = await this.service.toggleCampaign(req.params.id);
                res.json(campaign);
            } catch (error) {
                res.status(400).json({ error: error.message });
            }
        });
    }

    getRouter() {
        return this.router;
    }
}

module.exports = CampaignRoutes;
