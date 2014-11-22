def presentSubject(subj, root=False):
    return {
        "code": subj.code,
        "name": subj.name,
        "url": subj.link,
        "root": root,
        "credit": str(subj.credit),
        "commenceDate": subj.commence_date,
        "timeCommitment": subj.time_commitment,
        "overview": subj.overview,
        "objectives": subj.objectives,
        "assessment": subj.assessment,
        "prereq": subj.prerequisite,
        "coreq": subj.corequisite
    }


def presentFriend(socialAccount, **details):
    info = {
        "avatarUrl": socialAccount.get_avatar_url(),
        "fbUrl": socialAccount.get_profile_url(),
        "fullname": socialAccount.user.get_full_name(),
        "username": socialAccount.user.username
    }
    info.update(**details)

    return info


def presentUsername(user):
    if user.first_name and user.last_name:
        return "{} {}".format(user.first_name, user.last_name)
    elif user.first_name:
        return user.first_name
    elif user.last_name:
        return user.last_name
    else:
        return user.username
