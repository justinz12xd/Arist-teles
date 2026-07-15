from aristoteles.agents import parse_json


def test_parse_json_accepts_fenced_top_level_list() -> None:
    payload = parse_json('```json\n[{"provider_id":"a"}]\n```')

    assert payload == [{"provider_id": "a"}]
