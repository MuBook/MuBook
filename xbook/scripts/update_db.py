import json
import logging
import requests
import re

from xbook.ajax.models import Subject, SubjectPrereq


code_regex = re.compile(r"[A-Z]{4}\d{5}")


def subject_wo_nonallowed(subject):
    subject_wo_nonallowed = dict(subject)
    del subject_wo_nonallowed["nonallowed"]
    return subject_wo_nonallowed


def prereq_code(subject):
    return set(code_regex.findall(subject["prerequisite"]))


def process_subject(processed_subjects):
    for subject_code in processed_subjects:
        logging.info("Saving: " + subject_code)
        s = Subject.objects.update_or_create(
            code=subject_code,
            defaults=subject_wo_nonallowed(processed_subjects[subject_code])
        )


def process_prereq(processed_subjects):
    for subject_code in processed_subjects:
        logging.info("Adding requisite for: " + subject_code)
        s = Subject.objects.get(code=subject_code)
        for qcode in prereq_code(processed_subjects[subject_code]):
            try:
                q = Subject.objects.get(code=qcode)
                SubjectPrereq.objects.get_or_create(subject=s, prereq=q)
            except:
                logging.warning("Cannot save prerequisite relationship: " + subject_code + " - " + qcode)
                continue


def update_relationships(processed_subjects):
    logging.info("Adding requisites.")
    process_prereq(processed_subjects)
    logging.info("Done.")


def read_json(address, is_url=True):
    processed_subjects = {}
    if is_url:
        response = requests.get(address)
        processed_subjects = json.loads(response.content)
    else:
        f = open(address)
        content = f.read()
        f.close()
        processed_subjects = json.loads(content)
    return processed_subjects


def setup_logger():
    format = "%(asctime)s %(levelname)s: %(message)s"
    date_format = "%d/%m/%Y %H:%M:%S"
    logging.basicConfig(format=format, level=logging.INFO, datefmt=date_format)


def clear_old_subjects_relationships():
    logging.info("Clearing old nonallowed relationships")
    NonallowedSubject.objects.all().delete()

    logging.info("Clearing old requisite relationships")
    SubjectPrereq.objects.all().delete()

    logging.info("Finished clearing old subjects relationships")


def read_and_update(address, is_url=True):
    setup_logger()

    processed_subjects = read_json(address, is_url)
    process_subject(processed_subjects)
    update_relationships(processed_subjects)
