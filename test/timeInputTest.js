var timeInputTest = TestCase("TimeInputTest", {
  "test insertTimeSeparator":function(){
    expectAsserts(7);
    assertEquals("23:00", jQuery.timeInput.insertTimeSeparator("2300"));
    assertEquals("23:00", jQuery.timeInput.insertTimeSeparator("23:00"));
    assertEquals("3:00", jQuery.timeInput.insertTimeSeparator("300"));
    assertEquals("3:30", jQuery.timeInput.insertTimeSeparator("330"));
    assertEquals("1:", jQuery.timeInput.insertTimeSeparator("1"));
    assertEquals("19:", jQuery.timeInput.insertTimeSeparator("19"));
    assertEquals("Allow seconds, but they should be removed", "23:45", jQuery.timeInput.insertTimeSeparator("23:45:00"));
  }
});
