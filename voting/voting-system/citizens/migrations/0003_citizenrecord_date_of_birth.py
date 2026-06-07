from django.db import migrations, models

def seed_existing_citizens_dob(apps, schema_editor):
    CitizenRecord = apps.get_model("citizens", "CitizenRecord")
    CitizenRecord.objects.all().update(date_of_birth="1990-01-01")

class Migration(migrations.Migration):

    dependencies = [
        ('citizens', '0002_seed_citizens'),
    ]

    operations = [
        migrations.AddField(
            model_name='citizenrecord',
            name='date_of_birth',
            field=models.DateField(blank=True, null=True),
        ),
        migrations.RunPython(seed_existing_citizens_dob, migrations.RunPython.noop),
    ]
