# Generated migration for sub-task support

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('todo', '0002_remove_project_is_team_project_project_is_archived_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='task',
            name='parent_task',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='subtasks', to='todo.task', verbose_name='משימה אב'),
        ),
    ]
