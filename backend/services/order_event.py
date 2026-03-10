import logging
import inspect

listeners = {}

logger = logging.getLogger(__name__)


def subscribe(event_name, handler):
    """
    Register a handler for an event.
    """

    if event_name not in listeners:
        listeners[event_name] = []

    # Prevent duplicate handlers
    if handler not in listeners[event_name]:
        listeners[event_name].append(handler)


async def emit(event_name, data):
    """
    Emit an event to all subscribed handlers.
    """

    handlers = listeners.get(event_name, [])

    for handler in handlers:
        try:

            if inspect.iscoroutinefunction(handler):
                await handler(data)
            else:
                handler(data)

        except Exception as e:
            logger.error(f"Error in event '{event_name}' handler: {e}")