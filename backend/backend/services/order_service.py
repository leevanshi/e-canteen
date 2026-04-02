def create_order(order_doc):

    result = orders_collection.insert_one(order_doc)

    order_doc["_id"] = str(result.inserted_id)

    return order_doc