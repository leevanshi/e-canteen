import logging
import inspect
import asyncio
from collections import defaultdict

logger = logging.getLogger(__name__)

# =========================
# LISTENERS REGISTRY
# =========================

listeners = defaultdict(list)


# =========================
# SUBSCRIBE
# =========================

def subscribe(event_name: str, handler):
    """
    Register a handler for an event.
    """

    if handler not in listeners[event_name]:
        listeners[event_name].append(handler)


# =========================
# SAFE EXECUTION
# =========================

async def _run_handler(handler, data, event_name):

    try:

        if inspect.iscoroutinefunction(handler):
            await handler(data)

        else:
            loop = asyncio.get_running_loop()
            await loop.run_in_executor(None, handler, data)

    except Exception as e:

        logger.error(
            f"Event handler error for '{event_name}' -> {handler.__name__}: {e}"
        )


# =========================
# EMIT EVENT
# =========================

async def emit(event_name: str, data):
    """
    Emit event to all handlers concurrently.
    """

    handlers = listeners.get(event_name, [])

    if not handlers:
        return

    tasks = [
        _run_handler(handler, data, event_name)
        for handler in handlers
    ]

    await asyncio.gather(*tasks, return_exceptions=True)