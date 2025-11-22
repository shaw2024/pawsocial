import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Like = sequelize.define('Like', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  dogId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  targetDogId: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  tableName: 'likes',
  timestamps: true
});

export default Like;
