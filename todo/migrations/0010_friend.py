# Generated manually for Friend model

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('todo', '0009_googlecalendartoken'),
        ('auth', '0012_alter_user_first_name_max_length'),
    ]

    operations = [
        migrations.CreateModel(
            name='Friend',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('status', models.CharField(choices=[('pending', 'ממתין'), ('accepted', 'אושר'), ('declined', 'נדחה')], default='pending', max_length=10, verbose_name='סטטוס')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='נוצר בתאריך')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='עודכן בתאריך')),
                ('friend', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='friend_of', to='auth.user', verbose_name='חבר')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='friendships', to='auth.user', verbose_name='משתמש')),
            ],
            options={
                'verbose_name': 'חבר',
                'verbose_name_plural': 'חברים',
                'ordering': ['-created_at'],
            },
        ),
        migrations.AlterUniqueTogether(
            name='friend',
            unique_together={('user', 'friend')},
        ),
    ]