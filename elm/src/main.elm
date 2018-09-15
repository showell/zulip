port module Main exposing (..)

import Browser
import Dict exposing (..)
import Html exposing (..)
import Html.Attributes exposing (rows, cols, value, class, id, disabled)
import Html.Events exposing (onClick, onInput)
import Json.Encode as E
import Maybe
import Markdown
import Task
import Browser.Dom as Dom

-- TYPES

type alias UserId = String

type Status
    = WaitingForInput
    | Drafting
    | MessageInFlight

type Page
    = Messages_Page
    | People_Page

type alias Person =
    { email: String
    , user_id: String
    , name: String
    }

type alias InitialData =
    { person_list: List Person
    , partner_id: UserId
    , my_user_id: UserId
    }

type alias ZulipMessage =
    { id: Int
    , content: String
    , sender_id: UserId
    , target_id: UserId
    }

-- MODEL

type alias Model =
    { people: Dict UserId Person
    , messages: List ZulipMessage
    , status : Status
    , draft_message: String
    , partner_id: UserId
    , my_user_id: String
    , page: Page
    }

partner_email: Model -> Maybe String
partner_email model =
    Dict.get model.partner_id model.people
    |> Maybe.map .email

-- INIT and PORTS

type alias SendData =
    { content: String
    , partner_email: Maybe String
    }

init: InitialData -> ( Model, Cmd Msg )
init data =
    let
        people =
            List.map (\p -> (p.user_id, p)) data.person_list
            |> Dict.fromList

        model =
            { people = people
            , messages = []
            , draft_message = ""
            , status = WaitingForInput
            , partner_id = data.partner_id
            , my_user_id = data.my_user_id
            , page = People_Page
            }
    in
        ( model, Cmd.none )

port newZulipMessage : (ZulipMessage -> msg) -> Sub msg
port wantToSend : SendData -> Cmd msg

-- MESSAGES


type Msg
    = NoOp
    | NewZulipMessage ZulipMessage
    | SendButtonClicked
    | MessageComposed String
    | SetPartner UserId
    | SetPage Page


-- VIEW

{-|
    Elm doesn't direct support raw HTML.  Our
    raw_html method is a bit of a hack.

    When browsers support custom elements more
    widely, this may be the way to go (or
    find a polyfill):

            https://ellie-app.com/3mLFJ6f5zm4a1
-}

raw_html: String -> Html msg
raw_html text =
    let
        defaults = Markdown.defaultOptions

        options = { defaults | sanitize = False }
    in
        Markdown.toHtmlWith options [] text

view: Model -> Html Msg
view model =
    div []
        [ statusLine model
        , hr [] []
        , navBar model.page
        , viewPage model
        ]

viewPage: Model -> Html Msg
viewPage model =
    case model.page of
        Messages_Page ->
            pane
            [ composeBox model
            , viewMessages model
            ]

        People_Page ->
            pane
            [ viewPeople model
            ]

pane: List (Html Msg) -> Html Msg
pane html_msgs =
    div [] html_msgs

navBar: Page -> Html Msg
navBar page =
    let
        options =
            [ navOption page People_Page "People"
            , navOption page Messages_Page "Messages"
            ] |> List.intersperse (text " | ")
    in
        div [class "nav_bar"]
            [ span [] options
            ]

navOption: Page -> Page -> String -> Html Msg
navOption curr_page nav_page label =
    let
       button_text =
            if nav_page == curr_page
            then
                b [] [text label]
            else
                text label
    in
        button [onClick (SetPage nav_page)] [button_text]

composeBox: Model -> Html Msg
composeBox model =
    let
        draft_message = model.draft_message

        subject_line = span []
            [ text "to: "
            , b [] [text (partnerName model)]
            ]

        message_box =
            textarea [cols 60, rows 5, onInput MessageComposed, value draft_message, id "message_box"] []
    in
        div []
            [ div [] [subject_line]
            , table []
                [ tr [] [td [] [message_box]]
                , tr [] [td [class "align_right"] [saveButton model]]
                ]
            ]

partnerName: Model -> String
partnerName model =
    let
        partner: Maybe Person
        partner =
            Dict.get model.partner_id model.people

    in
        partner |> Maybe.map .name |> Maybe.withDefault "unknown"

statusLine: Model -> Html Msg
statusLine model =
    let
        status_string =
            case model.page of
                People_Page ->
                    "Viewing people..."

                Messages_Page ->
                    case model.status of
                        WaitingForInput ->
                            "Waiting for user input..."

                        Drafting ->
                            "Drafting message..."

                        MessageInFlight ->
                            "message in flight..."

    in
        div [class "status_line"]
        [
            span []
                [ text status_string
                ]
        ]

saveButton: Model -> Html Msg
saveButton model =
    let
        disabled_ = (model.status /= Drafting)

    in
        button [onClick SendButtonClicked, disabled disabled_] [text "Send"]

isCurrent: Model -> ZulipMessage -> Bool
isCurrent model message =
    if model.partner_id == model.my_user_id
    then
        -- only show messages to "myself"
        message.target_id == model.partner_id
    else
        -- show messages in either direction from our partner
        message.target_id == model.partner_id ||
        message.sender_id == model.partner_id

viewMessages: Model -> Html Msg
viewMessages model =
    let
        curr_messages =
            model.messages
            |> List.filter (isCurrent model)
    in
        if List.isEmpty curr_messages
        then
            text "There are no messages yet.  Start the conversation!"
        else
            div []
                [ h3 [] [text "Messages"]
                , table [class "message_list"]
                    (List.map (messageView model) curr_messages)
                ]

messageView: Model -> ZulipMessage -> Html Msg
messageView model message =
    let
        cell class_ content = td [class class_] [content]
    in
        tr []
           [ cell "message_sender" (senderView model message)
           , cell "message_content" (div [] [raw_html message.content])
           ]

senderView: Model -> ZulipMessage -> Html Msg
senderView model message =
    let
        sender_name = userName model message.sender_id

        target_name = userName model message.target_id

        names = sender_name ++ " -> " ++ target_name
    in
        p [] [text names]

userName: Model -> UserId -> String
userName model sender_id =
        if sender_id == model.my_user_id
        then
            "me"
        else
            case (Dict.get sender_id model.people) of
                Just p ->
                    p.name

                Nothing ->
                    "user " ++ sender_id

viewPeople: Model -> Html Msg
viewPeople model =
    let
        sorted_people =
            model.people
            |> Dict.values
            |> List.sortBy (\p -> p.name)
    in
        div []
            [ table []
                (List.map (personView model) sorted_people)
            ]

personView: Model -> Person -> Html Msg
personView model person =
    tr []
        [ td [] [text (personName model person)]
        , td [] [partnerButton model person.user_id]
        ]

personName: Model -> Person -> String
personName model person =
    if person.user_id == model.my_user_id
    then
        person.name ++ " (me)"
    else
        person.name

partnerButton: Model -> UserId -> Html Msg
partnerButton model user_id =
    if model.partner_id == user_id
    then
        text "current"
    else
        button [onClick (SetPartner user_id)] [text "converse"]


-- UPDATE

send : msg -> Cmd msg
send msg =
    Task.succeed msg
    |> Task.perform identity

update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        NoOp ->
            ( model, Cmd.none )

        NewZulipMessage zulip_message ->
            let
                model_ = { model
                    | messages = zulip_message :: model.messages
                    , status = WaitingForInput
                    }
            in
                ( model_, Cmd.none )

        SendButtonClicked ->
            let
                model_ = { model
                    | status = MessageInFlight
                    , draft_message = ""
                    }

                send_data =
                    { content = model.draft_message
                    , partner_email = partner_email model
                    }

                commands = Cmd.batch
                    [ focus_on_compose_box
                    , wantToSend send_data
                    ]
            in
                ( model_, commands )

        MessageComposed draft_message ->
            let
                status_ =
                    if draft_message == ""
                    then
                        WaitingForInput
                    else
                        Drafting

                model_ = { model
                    | draft_message = draft_message
                    , status = status_
                    }
            in
                ( model_, Cmd.none )

        SetPartner user_id ->
            let
                model_ = { model
                    | partner_id = user_id
                    }
            in
                ( model_, send (SetPage Messages_Page) )

        SetPage page ->
            let
                model_ = { model
                    | page = page
                    , status = WaitingForInput
                    , draft_message = ""
                    }

                cmd_ =
                    case page of
                        Messages_Page ->
                            focus_on_compose_box

                        other ->
                            Cmd.none

            in
                ( model_, cmd_ )

focus_on_compose_box: Cmd Msg
focus_on_compose_box =
    let
        ignore = (\_ -> NoOp)
    in
        Task.attempt ignore (Dom.focus "message_box")

-- SUBSCRIPTIONS


subscriptions : Model -> Sub Msg
subscriptions model =
    newZulipMessage NewZulipMessage


-- MAIN

main =
    Browser.element
        { init = init
        , update = update
        , subscriptions = subscriptions
        , view = view
        }
