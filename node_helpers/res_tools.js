/* NPM Module Import */
var colors    = require("colors");

exports.sendResponseSimple = function(response,process,result,reason,reason_detail){
//	log("Simple Response Happened");
	response.writeHead(200,{"Content-Type": "text/html"});
	response.end(JSON.stringify({
		process: process,
		result: result,
		reason: reason,
		reason_detail: reason_detail
	}),function(){
		if(reason == undefined){ console.log(colors.green("Info <" + process + ">: Response Successfully Sent.")); }
		else{ console.log(colors.yellow("Info <" + process + ">: Fail Response Successfully Sent.")); }
	});
}

exports.sendResponseSimpleWithData = function(response,process,result,data){
	response.writeHead(200,{"Content-Type": "text/html"});
	response.end(JSON.stringify({
		process: process,
		result: result,
		data: data
	}),function(){
		console.log(colors.green("Info <" + process + ">: Response Successfully Sent."));
	});
}

/*
	This Response Type will send data in the body, and loop through filePathList and add files
	of each path.
*/
exports.sendResponseSimpleWithFileData = function(response,process,result,filePathList,data){
//	response.writeHead(200,{"Content-Type": "multipart/formed-data"});
	writeFileDataResponseRecursive(0, filePathList, function(){
		endResponse();
	});
	
	function writeFileDataResponseRecursive(index,filePathList,callback){
		if(index == filePathList.length){
			return callback();
		}
		else{
			
			response.attachment(filePathList[index]);
			
//			response.write(fileDataList[index]);
			return writeFileDataResponseRecursive(index+1, filePathList, callback);
		}
	}
	
	function endResponse(){
		response.end(JSON.stringify({
			process: process,
			result: result,
			data: data
		}),function(){
			console.log(colors.green("Info <" + process + ">: Response Successfully Sent."));
		});
	}
}