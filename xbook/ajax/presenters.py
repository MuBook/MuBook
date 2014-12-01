def presentUserSubject(userSubject):
    return {
        "status": userSubject.state,
        "year": userSubject.year,
        "semester": userSubject.semester
    }


def presentSubject(subject, root=False, lite=True):
    node = {
        "code": subject.code,
        "name": subject.name,
        "root": root
    }
    if lite:
        return node

    node.update({
        "url": subject.link,
        "credit": str(subject.credit),
        "commenceDate": subject.commence_date,
        "timeCommitment": subject.time_commitment,
        "overview": subject.overview,
        "objectives": subject.objectives,
        "assessment": subject.assessment,
        "prereq": subject.prerequisite,
        "coreq": subject.corequisite
    })
    return node


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
