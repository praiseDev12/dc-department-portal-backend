import { Department } from '../models/Department.js';
import { Unit } from '../models/Unit.js';

export async function listDepartments() {
  // Only id + name are exposed publicly — never member or admin data.
  return Department.find({}, '_id name').sort('name');
}

export async function listUnitsForDepartment(departmentId) {
  return Unit.find({ department: departmentId }, '_id name').sort('name');
}
