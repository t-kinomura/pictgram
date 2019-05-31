require 'test_helper'

class SesstionControllerTest < ActionDispatch::IntegrationTest
  test "should get new" do
    get sesstion_new_url
    assert_response :success
  end

end
