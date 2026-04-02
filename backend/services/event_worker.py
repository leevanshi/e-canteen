import asyncio
from services.event_bus import event_queue, process_event

async def start_event_worker():

    while True:
        event = await event_queue.get()

        try:
            await process_event(event)
        except Exception as e:
            print("Event error:", e)

        event_queue.task_done()