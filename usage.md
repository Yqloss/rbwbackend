## /info/score
#### Require
`None`

#### Return
`200` Successful. Return how to score.

## /create
#### Require
`ign` The player name
`qq/kook` The qq or kook id or both of the player

#### Return
`200` Successful. Get registry data.
`400` Missing field
`409` The player with ign has been registered.

## /player
#### Require
`ign/qq/kook/id` The player name/qq/kook/id

#### Return
`200` Successful. Get player data
`400` Missing field
`404` Cannot find the player
`406` Too many search key
`500` Unexpected error

## /party/create
#### Require
`ign` The player name
`name` The name of the party