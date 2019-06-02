class Favorite < ApplicationRecord
  beloges_to :user
  beloges_to :topic
end
