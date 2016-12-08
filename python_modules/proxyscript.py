def request(flow):
    print(flow)
    print(flow.request)
    print(flow.request.data)
    req_method = str(flow.request.data.method.decode("utf-8"))
    if req_method == 'POST':
        headers = flow.request.headers
        body = flow.request.body
        req_method = str(flow.request.data.method.decode("utf-8"))
        http_v = str(flow.request.data.http_version.decode("utf-8"))
        host = str(flow.request.data.host.decode("utf-8"))
        url = str(flow.request.url)
        first_line = str(req_method + ' ' + url + ' ' + http_v) 
        filename = flow.request.url
        
        print("----POST_FETCH_BEGIN----");
        
        print("----POST_FETCH_CMD_BEGIN----");
        print(first_line)
        print("----POST_FETCH_CMD_END----");
        
        print("----POST_FETCH_HEADERS_BEGIN----");
        for header in headers:
            print(header + ':' + headers[header])    
        print("----POST_FETCH_HEADERS_END----");
        
        
        print("----POST_FETCH_BODY_BEGIN----");
        print("")
        print(flow.request.body.decode("utf-8"))
        print("----POST_FETCH_BODY_END----");
        
        print("----POST_FETCH_END----");
