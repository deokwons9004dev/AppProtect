def request(flow):
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
        print("\n")
        print("----------------")
        print("----------------")
        print("\n")
        print("\n")
        print("\n")
        print(first_line)
        print("\n")
        for header in headers:
            print(header + ':' + headers[header])    
        print("\n")
        print(flow.request.body.decode("utf-8"))
        print("\n")
        
        print("----------------")
        print("----------------")
