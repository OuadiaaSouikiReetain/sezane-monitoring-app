"""
Serializers automations — formate les données SFMC pour le frontend.
"""
from rest_framework import serializers


class AutomationSerializer(serializers.Serializer):
    id          = serializers.CharField()
    key         = serializers.CharField(allow_null=True, default=None)
    name        = serializers.CharField()
    description = serializers.CharField(allow_null=True, default=None)
    status      = serializers.CharField(allow_null=True, default=None)
    statusId    = serializers.IntegerField(allow_null=True, default=None)


class AutomationDetailSerializer(AutomationSerializer):
    steps = serializers.ListField(child=serializers.DictField(), default=list)


class ExecutionLogSerializer(serializers.Serializer):
    id_log           = serializers.CharField()
    sfmc_instance_id = serializers.CharField()
    component_id     = serializers.CharField()
    component_name   = serializers.CharField()
    status           = serializers.CharField()
    triggered_by     = serializers.CharField(allow_null=True)
    start_time       = serializers.DateTimeField(allow_null=True)
    end_time         = serializers.DateTimeField(allow_null=True)
    duration_seconds = serializers.FloatField(allow_null=True)
    error_code       = serializers.CharField(allow_null=True)
    error_message    = serializers.CharField(allow_null=True)
