import { Sequelize, DataTypes } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const config = {
    database: {
        url: process.env.DATABASE_URL || 'postgres://user:password@localhost:5432/aleo_monitor',
    },
    api: {
        port: process.env.PORT || 3000,
    },
    aleo: {
        sdkUrl: 'https://api.explorer.provable.com/v1',
        networkType: process.env.ALEO_NETWORK_TYPE || 'testnet',
    },
    jwt: {
        secret: process.env.JWT_SECRET || 'your_jwt_secret',
        expiresIn: '1d',
    },
};

const sequelize = new Sequelize(config.database.url, {
    logging: console.log,
});

// User modelini tanımlayın
const User = sequelize.define('User', {
    username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
});

// Veritabanı bağlantısını başlatın ve test edin
export async function initDatabase() {
    try {
        await sequelize.authenticate();
        console.log('Veritabanına başarıyla bağlanıldı.');

        // Modelleri senkronize edin (tabloları oluşturun)
        await sequelize.sync({ alter: true }); // force: true yerine alter: true kullanıyoruz
        console.log('Veritabanı modelleri senkronize edildi.');

    } catch (error) {
        console.error('Veritabanı başlatılırken hata oluştu:', error);
        throw error; // Hatayı yukarı fırlat
    }
}

// initDatabase fonksiyonunu burada çağırmıyoruz

export { sequelize, User, config };