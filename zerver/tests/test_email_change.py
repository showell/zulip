# -*- coding: utf-8 -*-
from __future__ import absolute_import

import datetime
from typing import Any

import django
import mock
from django.conf import settings
from django.http import HttpResponse
from django.urls import reverse
from django.utils.timezone import now

from confirmation.models import EmailChangeConfirmation, generate_key
from zerver.lib.actions import do_start_email_change_process
from zerver.lib.test_classes import (
    ZulipTestCase,
)
from zerver.models import get_user_profile_by_email, EmailChangeStatus


class EmailChangeTestCase(ZulipTestCase):
    def test_confirm_email_change_with_non_existent_key(self):
        # type: () -> None
        self.login('hamlet@zulip.com')
        key = generate_key()
        url = EmailChangeConfirmation.objects.get_activation_url(key)
        response = self.client_get(url)
        self.assertEqual(response.status_code, 200)
        self.assertIn("Whoops", response.content.decode('utf8'))

    def test_confirm_email_change_with_invalid_key(self):
        # type: () -> None
        self.login('hamlet@zulip.com')
        key = 'invalid key'
        url = EmailChangeConfirmation.objects.get_activation_url(key)
        response = self.client_get(url)
        self.assertEqual(response.status_code, 200)
        self.assertIn("Whoops", response.content.decode('utf8'))

    def test_confirm_email_change_when_time_exceeded(self):
        # type: () -> None
        old_email = 'hamlet@zulip.com'
        new_email = 'hamlet-new@zulip.com'
        user_profile = get_user_profile_by_email(old_email)
        obj = EmailChangeStatus.objects.create(new_email=new_email,
                                               old_email=old_email,
                                               user_profile=user_profile)
        key = generate_key()
        date_sent = now() - datetime.timedelta(days=2)
        EmailChangeConfirmation.objects.create(content_object=obj,
                                               date_sent=date_sent,
                                               confirmation_key=key)
        url = EmailChangeConfirmation.objects.get_activation_url(key)
        response = self.client_get(url)
        self.assertEqual(response.status_code, 200)
        self.assertIn("Whoops", response.content.decode('utf8'))

    def test_confirm_email_change(self):
        # type: () -> None
        old_email = 'hamlet@zulip.com'
        new_email = 'hamlet-new@zulip.com'
        user_profile = get_user_profile_by_email(old_email)
        obj = EmailChangeStatus.objects.create(new_email=new_email,
                                               old_email=old_email,
                                               user_profile=user_profile)
        key = generate_key()
        EmailChangeConfirmation.objects.create(content_object=obj,
                                               date_sent=now(),
                                               confirmation_key=key)
        url = EmailChangeConfirmation.objects.get_activation_url(key)
        response = self.client_get(url)
        self.assertEqual(response.status_code, 200)
        self.assertIn("Your new email address is confirmed",
                      response.content.decode('utf8'))
        user_profile = get_user_profile_by_email(new_email)
        self.assertTrue(bool(user_profile))
        obj.refresh_from_db()
        self.assertEqual(obj.status, 1)

    def test_start_email_change_process(self):
        # type: () -> None
        user_profile = get_user_profile_by_email('hamlet@zulip.com')
        do_start_email_change_process(user_profile, 'hamlet-new@zulip.com')
        self.assertEqual(EmailChangeStatus.objects.count(), 1)
