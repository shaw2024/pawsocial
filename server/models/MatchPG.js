import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Match = sequelize.define('Match', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  dog1Id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  dog2Id: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  tableName: 'matches',
  timestamps: true
});

export default Match;
