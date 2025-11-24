import json
import os

def analyze_json(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    triggers = {}
    sub_actions = {}

    def process_triggers(trigger_list):
        for t in trigger_list:
            t_type = t.get('type')
            if t_type not in triggers:
                triggers[t_type] = {'count': 0, 'keys': set(), 'examples': []}
            triggers[t_type]['count'] += 1
            triggers[t_type]['keys'].update(t.keys())
            if len(triggers[t_type]['examples']) < 1:
                triggers[t_type]['examples'].append(t)

    def process_sub_actions(sub_action_list):
        for s in sub_action_list:
            s_type = s.get('type')
            if s_type not in sub_actions:
                sub_actions[s_type] = {'count': 0, 'keys': set(), 'examples': []}
            sub_actions[s_type]['count'] += 1
            sub_actions[s_type]['keys'].update(s.keys())
            if len(sub_actions[s_type]['examples']) < 1:
                sub_actions[s_type]['examples'].append(s)
            
            if 'subActions' in s:
                process_sub_actions(s['subActions'])

    if 'data' in data and 'actions' in data['data']:
        for action in data['data']['actions']:
            if 'triggers' in action:
                process_triggers(action['triggers'])
            if 'subActions' in action:
                process_sub_actions(action['subActions'])

    output_path = r"c:\Users\HYPNO\.gemini\antigravity\brain\2c0ce1c7-2eee-4208-8a43-dc5cb0f612e6\analysis_output.txt"
    with open(output_path, 'w', encoding='utf-8') as out_f:
        def log(msg):
            print(msg)
            out_f.write(msg + '\n')

        log("--- TRIGGERS ---")
        for t_type, info in sorted(triggers.items()):
            log(f"Type {t_type}: {info['count']} occurrences")
            log(f"  Keys: {', '.join(sorted(info['keys']))}")
            log(f"  Example: {json.dumps(info['examples'][0], indent=2)}")

        log("\n--- SUB-ACTIONS ---")
        for s_type, info in sorted(sub_actions.items()):
            log(f"Type {s_type}: {info['count']} occurrences")
            log(f"  Keys: {', '.join(sorted(info['keys']))}")
            log(f"  Example: {json.dumps(info['examples'][0], indent=2)}")

if __name__ == "__main__":
    analyze_json(r"c:\Users\HYPNO\.gemini\antigravity\scratch\Projects\[MELTY] SB Encoder & Decoder\monolithic_export.json")
