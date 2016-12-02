/* DB_Strings.js 
 *
 * This file contains all the query strings used in the server.
 * 
 * Author : David Song (deokwons9004dev@gmail.com)
 * Version: 16-11-30
 */

exports.userExists               = "SELECT * FROM Users WHERE user_id = ?";
exports.userRegister             = "INSERT INTO Users VALUES (?,?,?,?)";

exports.roomGetAll               = "SELECT * FROM Rooms";
exports.roomGetByName            = "SELECT * FROM Rooms WHERE room_name = ?";
exports.roomInsertNew            = "INSERT INTO Rooms VALUES (?,?)";
exports.roomUpdateUsers          = "UPDATE Rooms SET room_users = ? WHERE room_name = ?";
exports.roomDeleteByName         = "DELETE FROM Rooms WHERE room_name = ?";

exports.msgGetByRoom             = "SELECT * FROM Messages WHERE msg_room = ? ORDER BY msg_time";
exports.msgInsertNew             = "INSERT INTO Messages VALUES (?,?,?,?)";
exports.msgDeleteBySenderAndRoom = "DELETE FROM Messages WHERE msg_sender = ? AND msg_room = ?";