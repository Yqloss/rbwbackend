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
`201` Successful. Get registry data.
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

#### Return
`200` Successful. Get registry data.
`400` Missing field
`404` Cannot find the player
`409` The player already has a party.

## /party/join
#### Require
`ign` The player name
`leader` The name of another of the party

#### Return
`200` Successful. Get registry data.
`400` Missing field
`404` Cannot find the player
`406` The party is full
`409` The player already has a party / The leader doesn't have a party.

## /party/leave
#### Require
`ign` The player name

#### Return
`200` Successful. Get registry data.
`400` Missing field
`404` Cannot find the player
`406` Cannot leave (Caused by the player is leader)
`409` The player doesn't have a party.

## /party/find
#### Require
`ign/name` The player name / The party name

#### Return
`200` Successful. Get registry data.
`400` Missing field
`404` Cannot find the player or the party
`409` The player doesn't have a party.

## /party/disband
#### Require
`ign` The player name

#### Return
`200` Successful. Get empty registry data.
`400` Missing field
`404` Cannot find the player
`406` This player is not the leader
`409` The player doesn't have a party.

## /game/queue
#### Require
`ign` The player name

#### Return
`200` Successful. Matched.
`201` Successful. Queued.
`400` Missing field
`404` Cannot find the player
`406` This player is not the leader. / The party is not full.
`409` The player doesn't have a party.
