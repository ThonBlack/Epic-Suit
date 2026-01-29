const fs = require('fs');
const path = require('path');

class ModuleManager {
    constructor(app, io, prisma, waService) {
        this.app = app;
        this.io = io;
        this.prisma = prisma;
        this.waService = waService;
        this.modules = new Map();
    }

    async loadModules() {
        const modulesPath = path.join(__dirname, '..', 'modules');

        if (!fs.existsSync(modulesPath)) {
            console.log('📂 Diretório de módulos não encontrado, criando...');
            fs.mkdirSync(modulesPath, { recursive: true });
            return;
        }

        const entries = fs.readdirSync(modulesPath, { withFileTypes: true });

        for (const entry of entries) {
            if (entry.isDirectory()) {
                await this.loadModule(entry.name);
            }
        }
    }

    async loadModule(moduleName) {
        try {
            const modulePath = path.join(__dirname, '..', 'modules', moduleName);
            const indexFile = path.join(modulePath, 'index.js');

            if (fs.existsSync(indexFile)) {
                console.log(`📦 Carregando módulo: ${moduleName}...`);
                const ModuleClass = require(indexFile);

                const moduleInstance = new ModuleClass({
                    app: this.app,
                    io: this.io,
                    prisma: this.prisma,
                    waService: this.waService
                });

                if (moduleInstance.init) {
                    await moduleInstance.init();
                }

                this.modules.set(moduleName, moduleInstance);
                console.log(`✅ Módulo ${moduleName} carregado com sucesso!`);
            }
        } catch (error) {
            console.error(`❌ Erro ao carregar módulo ${moduleName}:`, error);
        }
    }

    getModule(moduleName) {
        return this.modules.get(moduleName);
    }
}

module.exports = ModuleManager;
