import json
import logging
import requests
import re

from xbook.ajax.models import Subject, SubjectPrereq

code_regex = re.compile(r"[A-Z]{4}\d{5}")


def log(message):
    def wrapper(fn):
        def logged_fn(*args, **kwargs):
            logging.info("Starting: {}".format(message))
            return_val = fn(*args, **kwargs)
            logging.info("Finished: {}".format(message))
            return return_val
        return logged_fn
    return wrapper


@log("deleting nonallowed subjects")
def subject_wo_nonallowed(subject):
    subject_wo_nonallowed = dict(subject)
    del subject_wo_nonallowed["nonallowed"]
    return subject_wo_nonallowed


def prereq_codes(subjects, subject_code):
    logging.info("searching for prerequisites of {}".format(subject_code))
    return set(code_regex.findall(subjects[subject_code]["prerequisite"]))


@log("processing subjects")
def process_subjects(processed_subjects):
    for subject_code in processed_subjects:
        logging.info("Saving: " + subject_code)
        s = Subject.objects.update_or_create(
            code=subject_code,
            defaults=subject_wo_nonallowed(processed_subjects[subject_code])
        )


@log("processing prereqs")
def process_prereqs(processed_subjects):
    for subject_code in processed_subjects:
        s = Subject.objects.get(code=subject_code)
        for qcode in prereq_codes(processed_subjects, subject_code):
            try:
                q = Subject.objects.get(code=qcode)
                SubjectPrereq.objects.get_or_create(subject=s, prereq=q)
            except:
                logging.error("Cannot save prerequisite relation: " + subject_code + " - " + qcode)
                continue


@log("updating subject relations")
def update_relationships(processed_subjects):
    process_prereqs(processed_subjects)


@log("loading json")
def read_json(address, is_url=True):
    if is_url:
        response = requests.get(address)
        return json.loads(response.content)
    else:
        with open(address) as f:
            content = f.read()
        return json.loads(content)


def setup_logger():
    log_format = "%(asctime)s %(levelname)s: %(message)s"
    date_format = "%d/%m/%Y %H:%M:%S"
    logging.basicConfig(format=log_format, level=logging.INFO, datefmt=date_format)


def clear_old_subjects_relationships():
    logging.info("Clearing old nonallowed relationships")
    NonallowedSubject.objects.all().delete()

    logging.info("Clearing old requisite relationships")
    SubjectPrereq.objects.all().delete()

    logging.info("Finished clearing old subjects relationships")


def read_and_update(address, is_url=True):
    setup_logger()

    processed_subjects = read_json(address, is_url)
    process_subjects(processed_subjects)
    update_relationships(processed_subjects)
