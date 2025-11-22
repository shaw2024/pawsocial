import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Dog = sequelize.define('Dog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  ownerId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 1
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  age: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  breed: {
    type: DataTypes.STRING,
    allowNull: true
  },
  gender: {
    type: DataTypes.STRING,
    allowNull: true
  },
  energy: {
    type: DataTypes.STRING,
    allowNull: true
  },
  temperament: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  vaccinated: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  images: {
    type: DataTypes.ARRAY(DataTypes.TEXT),
    defaultValue: []
  },
  city: {
    type: DataTypes.STRING,
    allowNull: true
  },
  zip: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'dogs',
  timestamps: true
});

export default Dog;
