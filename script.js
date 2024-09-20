const fs = require('fs');
const path = require('path');

// Klasör yapısı
const directories = [
  'src/config',
  'src/database/models',
  'src/services',
  'src/api/routes',
  'src/api/middleware',
  'src/utils',
  'tests/unit',
  'tests/integration',
  'docs'
];

// Dosya listesi
const files = {
  'src/config/index.ts': '',
  'src/database/index.ts': '',
  'src/database/models/Validator.ts': '',
  'src/database/models/Block.ts': '',
  'src/database/models/Transaction.ts': '',
  'src/services/AleoSDKService.ts': '',
  'src/services/RestApiService.ts': '',
  'src/services/SnarkOSDBService.ts': '',
  'src/services/ValidatorService.ts': '',
  'src/services/BlockService.ts': '',
  'src/services/AlertService.ts': '',
  'src/api/routes/validators.ts': '',
  'src/api/routes/blocks.ts': '',
  'src/api/middleware/auth.ts': '',
  'src/api/middleware/errorHandler.ts': '',
  'src/api/index.ts': '',
  'src/utils/logger.ts': '',
  'src/utils/encryption.ts': '',
  'src/index.ts': '',
  'tests/unit/example.test.ts': '',
  'tests/integration/example.integration.test.ts': '',
  'docs/api.md': '',
  'docs/database-schema.md': '',
  'package.json': '',
  'tsconfig.json': ''
};

// Klasörleri oluşturma
directories.forEach(dir => {
  fs.mkdirSync(path.join(__dirname, dir), { recursive: true });
});

// Dosyaları oluşturma
Object.keys(files).forEach(file => {
  fs.writeFileSync(path.join(__dirname, file), files[file]);
});

console.log('Proje yapısı başarıyla oluşturuldu!');
