# Generated migration for Google Calendar Token model

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('todo', '0008_userprofile_avatar_manually_edited'),
    ]

    operations = [
        migrations.CreateModel(
            name='GoogleCalendarToken',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('access_token', models.TextField()),
                ('refresh_token', models.TextField(blank=True, null=True)),
                ('token_uri', models.CharField(default='https://oauth2.googleapis.com/token', max_length=255)),
                ('client_id', models.CharField(max_length=255)),
                ('client_secret', models.CharField(max_length=255)),
                ('scopes', models.JSONField(default=list)),
                ('expiry', models.DateTimeField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('is_active', models.BooleanField(default=True)),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='calendar_token', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'Google Calendar Token',
                'verbose_name_plural': 'Google Calendar Tokens',
            },
        ),
    ]

