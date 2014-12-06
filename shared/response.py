from django.http import HttpResponse

responseTemplate = '''
def r{statusCode}(*args, **kwargs):
    return HttpResponse(*args, status={statusCode}, **kwargs)
'''

statusCodes = [
    100, 101, 102, 200, 201, 202, 203, 204, 205, 206, 207, 208, 226, 300, 301, 302, 303,
    304, 305, 306, 307, 308, 400, 401, 402, 403, 404, 405, 406, 407, 408, 409, 410, 411,
    412, 413, 414, 415, 416, 417, 418, 419, 420, 422, 423, 424, 426, 428, 429, 431, 440,
    444, 449, 450, 451, 494, 495, 496, 497, 498, 499, 500, 501, 502, 503, 504, 505, 506,
    507, 508, 509, 510, 511, 520, 521, 522, 523, 524, 598, 599
]

for statusCode in statusCodes:
    exec(responseTemplate.format(statusCode=statusCode))
