const fs = require('fs');
const path = require('path');

function replaceInFile(filePath) {
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace imports
    content = content.replace(/import type \{ User \} from '..\/models\/user.model.js';/g, "import { Usuario } from '../models/usuario.model.js';");
    content = content.replace(/import type \{ Card, PokemonCardData \} from '..\/models\/card.model.js';/g, "import { Carta } from '../models/carta.model.js';");
    content = content.replace(/import type \{ CollectionItem \} from '..\/models\/collection.model.js';/g, "import { CartaColecao } from '../models/colecao.model.js';");
    content = content.replace(/import type \{ Folder \} from '..\/models\/folder.model.js';/g, "import { Binder } from '../models/binder.model.js';");
    
    // Replace types
    content = content.replace(/\bUser\b/g, "Usuario");
    content = content.replace(/\bCollectionItem\b/g, "CartaColecao");
    content = content.replace(/\bFolder\b/g, "Binder");
    content = content.replace(/\bCard\b/g, "Carta");

    // Replace properties for CartaColecao and Carta
    content = content.replace(/\.cardData\.images\.small/g, ".cartaBase.imagem");
    content = content.replace(/\.cardData\.images\.large/g, ".cartaBase.imagem");
    content = content.replace(/\.cardData\.name/g, ".cartaBase.nome");
    content = content.replace(/\.cardData\.rarity/g, ".cartaBase.raridade");
    content = content.replace(/\.cardData\.id/g, ".cartaBase.id");
    content = content.replace(/\.cardId/g, ".cartaBase.id");
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Refactored:', filePath);
}

const walkSync = (dir, filelist = []) => {
    fs.readdirSync(dir).forEach(file => {
        filelist = fs.statSync(path.join(dir, file)).isDirectory()
            ? walkSync(path.join(dir, file), filelist)
            : filelist.concat(path.join(dir, file));
    });
    return filelist;
};

const tsFiles = walkSync('./src').filter(f => f.endsWith('.ts'));
tsFiles.forEach(replaceInFile);

