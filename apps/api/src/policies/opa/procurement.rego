package procurement.compliance

default allow = false

allow {
    input.threshold_met == true
    input.gst_valid == true
    input.credential_fresh == true
    input.identity_verified == true
}

threshold_met {
    input.working_capital_paise >= input.required_threshold_paise
}

gst_valid {
    input.gst_status == "ACTIVE"
}

credential_fresh {
    age_seconds := input.current_timestamp - input.credential_timestamp
    age_seconds <= input.max_credential_age_seconds
}

violations[msg] {
    not threshold_met
    msg := "Working capital below required threshold"
}

violations[msg] {
    not gst_valid
    msg := "GST registration not active"
}

violations[msg] {
    not credential_fresh
    msg := "Financial credential has expired"
}
