import flask
import db_service as db
import uuid


async def is_edit_key_correct(test_id: int, edit_key: uuid.UUID) -> bool:
    original_edit_key = await db.get_edit_key_by_test_id(test_id)
    if original_edit_key is None or edit_key != original_edit_key:
        return False
    return True


async def check_request(request: flask.request) -> dict:
    try:
        test_id = int(request.args.get('testId'))
        edit_key = uuid.UUID(request.args.get('editKey'))
    except Exception:
        return {'pass': False, 'error': 'Invalid test ID or edit key'}

    if not await is_edit_key_correct(test_id, edit_key):
        return {'pass': False, 'error': 'Test not found or Edit key does not match'}

    return {'pass': True, 'test_id': test_id, 'edit_key': edit_key}
