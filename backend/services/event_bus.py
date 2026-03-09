listeners = {}

def subscribe(event_name, handler):

    if event_name not in listeners:
        listeners[event_name] = []

    listeners[event_name].append(handler)


def emit(event_name, data):

    handlers = listeners.get(event_name, [])

    for handler in handlers:
        handler(data)