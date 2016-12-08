from pprint import pprint

def request(temp1,flow):
	req_method = str(flow.request.method.decode("utf-8"))
	if req_method == 'POST':
		pprint(vars(flow.request));
		headers    = flow.request.headers
		body       = flow.request.content
		http_v     = 'HTTP/' + str(flow.request.httpversion[0]) + '.' + str(flow.request.httpversion[1])
		host       = str(flow.request.host.decode("utf-8"))
		url        = str(flow.request.scheme.decode("utf-8")) + '://' + host + str(flow.request.path.decode("utf-8"))
		first_line = str(req_method + ' ' + url + ' ' + http_v) 
		filename   = flow.request.url
		
		print("----POST_FETCH_BEGIN----");
		
		print("----POST_FETCH_CMD_BEGIN----");
		print(first_line)
		print("----POST_FETCH_CMD_END----");
		
		print("----POST_FETCH_HEADERS_BEGIN----");
		for header in headers:
			print(header[0] + ':' + header[1])    
		print("----POST_FETCH_HEADERS_END----");
		
		
		print("----POST_FETCH_BODY_BEGIN----");
		print("")
		print(body)
		print("----POST_FETCH_BODY_END----");
		
		print("----POST_FETCH_END----");


