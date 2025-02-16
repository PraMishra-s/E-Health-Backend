import { v4 as uuidv4 } from "uuid";

export function generateUniqueCode() {
  return uuidv4().replace(/-/g, "").substring(0, 25);
}

export function generateOTP(){
  return Math.floor(100000 + Math.random() * 900000).toString();
}